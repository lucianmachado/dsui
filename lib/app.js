const createError = require('http-errors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const ds = require('./middlewares/ds');
const indexRoute = require('./routes/index');
const entityRoute = require('./routes/entity');
const deleteEntitiesRoute = require('./routes/delete-entities');

function getBootstrapPath() {
	return process.mainModule.paths.reduce((bPath, p) => {
		const possiblePath = path.join(p, 'bootstrap/dist/');
		if (bPath === null && fs.existsSync(possiblePath)) {
			return possiblePath
		}
		return bPath;
	}, null)
}

module.exports = (
	{
		ds: {
			projectId,
			apiEndpoint,
			keyFilename,
			filters
		}
	}
) => {
	const app = express();

	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'pug');
	app.use(ds({
		projectId,
		apiEndpoint,
		keyFilename,
		filters
	}))
	if (process.env.NODE_ENV !== 'production') {
		app.use(morgan('dev'));
		app.locals.pretty = true;
	}
	const bootstrapPath = getBootstrapPath();
	console.log(bootstrapPath);
	if (bootstrapPath) {
		app.use('/bootstrap', express.static(bootstrapPath));
	}
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, 'public')));
	app.use('/', indexRoute);
	app.use('/', entityRoute);
	app.use('/', deleteEntitiesRoute);

	// catch 404 and forward to error handler
	app.use(function (req, res, next) {
		next(createError(404));
	});

	// error handler
	app.use(function (err, req, res, next) {
		// set locals, only providing error in development
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};

		// render the error page
		res.status(err.status || 500);
		res.render('error');
	});
	return app;
}