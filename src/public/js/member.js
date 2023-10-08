/* eslint-disable no-undef */
const goToSignInBtn = document.getElementById('go-to-sign-in-btn');
const goToSignUpBtn = document.getElementById('go-to-sign-up-btn');
const signUpForm = document.getElementById('sign-up-form');
const signInForm = document.getElementById('sign-in-form');
const member = document.querySelector('.member');

goToSignInBtn.addEventListener('click', () => {
  member.classList.remove('right-panel-active');
});

goToSignUpBtn.addEventListener('click', () => {
  member.classList.add('right-panel-active');
});

signUpForm.addEventListener('submit', (e) => e.preventDefault());
signInForm.addEventListener('submit', (e) => e.preventDefault());

document.getElementById('sign-in').addEventListener('click', signIn);
document.getElementById('sign-up').addEventListener('click', signUp);

async function signIn() {
  const userData = {
    provider: 'native',
    email: document.getElementById('sign-in-email').value,
    password: document.getElementById('sign-in-password').value,
  };

  const response = await fetch('/api/1.0/user/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const json = await response.json();
  if (!response.ok) {
    Swal.fire({
      icon: 'error',
      title: json.errorMsg,
    });
    return;
  }
  localStorage.setItem('access_token', json.accessToken);
  window.location.href = './map.html';
}

async function signUp() {
  const userData = {
    name: document.getElementById('sign-up-name').value,
    email: document.getElementById('sign-up-email').value,
    password: document.getElementById('sign-up-password').value,
  };

  const response = await fetch('/api/1.0/user/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const json = await response.json();
  if (!response.ok) {
    Swal.fire({
      icon: 'error',
      title: json.errorMsg,
    });
    return;
  }
  localStorage.setItem('access_token', json.accessToken);
  window.location.href = './map.html';
}

// Facebook Login
// eslint-disable-next-line no-unused-vars
function checkLoginState() {
  FB.getLoginStatus(async (fbResponse) => {
    if (fbResponse.status === 'connected') {
      const userData = {
        provider: 'facebook',
        accessToken: fbResponse.authResponse.accessToken,
      };

      const response = await fetch('/api/1.0/user/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const json = await response.json();
      if (!response.ok) {
        switch (response.status) {
          case 403:
            Swal.fire({
              icon: 'error',
              title: 'Facebook sign in failed',
            });
            break;
          case 500:
          default:
            Swal.fire({
              icon: 'error',
              title: 'Sorry, member service is temporarily unavailable',
            });
            break;
        }
        return;
      }
      localStorage.setItem('access_token', json.accessToken);
      window.location.href = './map.html';
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Facebook sign in failed',
      });
    }
  });
}

window.fbAsyncInit = function () {
  FB.init({
    appId: '237769527734722',
    cookie: true,
    xfbml: true,
    version: 'v9.0',
  });

  FB.AppEvents.logPageView();
};

// Load Facebook SDK asynchronously
(function (d, s, id) {
  const fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) { return; }
  const js = d.createElement(s);
  js.id = id;
  js.src = 'https://connect.facebook.net/en_US/sdk.js';
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

function checkAccessToken() {
  const token = localStorage.getItem('access_token');
  if (token) {
    fetch('/api/1.0/user/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      if (!response.ok) throw new Error(response.statusText);
      return response.json();
    }).then((json) => {
      window.location.href = './map.html';
    }).catch((error) => {
      console.log('Fetch Error: ', error);
    });
  }
}

checkAccessToken();
