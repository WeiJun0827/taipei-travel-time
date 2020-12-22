/* eslint-disable no-undef */
const goToSignInBtn = document.getElementById('goToSignIn');
const goToSignUpBtn = document.getElementById('goToSignUp');
const fistForm = document.getElementById('form1');
const secondForm = document.getElementById('form2');
const member = document.querySelector('.member');


goToSignInBtn.addEventListener('click', () => {
	member.classList.remove('right-panel-active');
});

goToSignUpBtn.addEventListener('click', () => {
	member.classList.add('right-panel-active');
});

fistForm.addEventListener('submit', (e) => e.preventDefault());
secondForm.addEventListener('submit', (e) => e.preventDefault());

document.getElementById('sign-in').addEventListener('click', signIn);
document.getElementById('sign-up').addEventListener('click', signUp);

window.fbAsyncInit = function () {
	FB.init({
		appId: '237769527734722',
		cookie: true,
		xfbml: true,
		version: 'v9.0'
	});

	FB.AppEvents.logPageView();

};


function signIn() {
	const userData = {
		provider: 'native',
		email: document.getElementById('sign-in-email').value,
		password: document.getElementById('sign-in-password').value,
	};

	fetch('/api/1.0/user/signin', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(userData)
	}).then(response => {
		if (!response.ok) throw new Error(response.statusText);
		return response.json();
	}).then(json => {
		const token = json.data.access_token;
		localStorage.setItem('access_token', token);
		window.location.href = './';
	}).catch(error => {
		console.log('Fetch Error: ', error);
	});
}


function signUp() {
	const userData = {
		name: document.getElementById('sign-up-name').value,
		email: document.getElementById('sign-up-email').value,
		password: document.getElementById('sign-up-password').value,
	};

	fetch('/api/1.0/user/signup', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(userData)
	}).then(response => {
		if (!response.ok) throw new Error(response.statusText);
		return response.json();
	}).then(json => {
		const token = json.data.access_token;
		localStorage.setItem('access_token', token);
		window.location.href = './';
	}).catch(error => {
		console.log('Fetch Error: ', error);
	});
}

(function (d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) { return; }
	js = d.createElement(s); js.id = id;
	js.src = 'https://connect.facebook.net/en_US/sdk.js';
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

function onSignIn(googleUser) {
	const profile = googleUser.getBasicProfile();
	console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
	console.log('Name: ' + profile.getName());
	console.log('Image URL: ' + profile.getImageUrl());
	console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
}

function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
	});
}

function checkAccessToken() {
	const token = localStorage.getItem('access_token');
	if (token) {
		fetch('/api/1.0/user/profile', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`
			}
		}).then(response => {
			if (!response.ok) throw new Error(response.statusText);
			return response.json();
		}).then(json => {
			window.location.href = './';
		}).catch(error => {
			console.log('Fetch Error: ', error);
		});
	}
}

checkAccessToken();