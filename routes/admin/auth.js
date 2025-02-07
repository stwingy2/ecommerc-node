const express = require('express');
const { check, validationResult } = require('express-validator');
const usersRepo = require('../../repositorys/users');
const router = express.Router();
const signupTemplate = require('../../views/admin/auth/signup');
const signinTemplate = require('../../views/admin/auth/signin');
router.get('/signup', (req, res) => {
	res.send(signupTemplate({ req }));
});

router.post(
	'/signup',
	[
		check('email').trim().normalizeEmail().isEmail().custom(async (email) => {
			const existingUser = await usersRepo.getOneBy({ email });

			if (existingUser) {
				throw new Error('Email in use');
			}
		}),
		check('password').trim().isLength({ min: 4, max: 20 }).withMessage('Between 4 and 20 characters'),
		check('passwordConfirmation')
			.trim()
			.isLength({ min: 4, max: 20 })
			.withMessage('Between 4 and 20 characters')
			.custom((pc, { req }) => {
				if (pc !== req.body.password) {
					throw new Error('Passwords must match');
				}
			})
	],
	async (req, res) => {
		const errors = validationResult(req);
		console.log(errors);
		const { email, password, passwordConfirmation } = req.body;

		const user = await usersRepo.create({ email, password }); //id returned for cookie
		req.session.userId = user.id; //req.session is a cookie-sessio object -can add anything to it
		res.send('Suucess');
	}
);
router.get('/signout', (req, res) => {
	req.session = null;
	res.send('You are logged out');
});
router.get('/signin', (req, res) => {
	res.send(signinTemplate());
});
router.post('/signin', async (req, res) => {
	const { email, password } = req.body;
	const user = await usersRepo.getOneBy({ email });
	if (!user) {
		return res.send('Email not found');
	}
	const validPassword = await usersRepo.comparePasswords(user.password, password);
	if (!validPassword) {
		return res.send('Invalid password');
	}
	req.session.userId = user.id;
	res.send('You are signed in');
});

module.exports = router;
