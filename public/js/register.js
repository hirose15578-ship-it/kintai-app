const registerForm = document.querySelector("#registerForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const passwordConfirmInput = document.querySelector("#passwordConfirm");
const errorMessage = document.querySelector("#errorMessage");
const successMessage = document.querySelector("#successMessage");
const usernameInput = document.querySelector("#username");


function showError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = "";
}

function showSuccess(message) {
  successMessage.textContent = message;
}

function clearSuccess() {
  successMessage.textContent = "";
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearError();
    clearSuccess();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    if(username === "") {
      showError("ユーザー名を入力してください");
      usernameInput.focus();
      return;
    }
    
    if (email === "") {
      showError("メールアドレスを入力してください");

      emailInput.focus();
      return;
    }

    if (!emailInput.validity.valid) {
      showError("正しい形式のメールアドレスを入力してください");

      emailInput.focus();
      return;
    }

    if (password === "") {
      showError("パスワードを入力してください");

      passwordInput.focus();
      return;
    }

    if (password.length < 8) {
      showError("パスワードは8文字以上で入力してください");

      passwordInput.focus();
      return;
    }

    if (password !== passwordConfirm) {
      showError("確認用パスワードが一致しません");

      passwordConfirmInput.focus();
      return;
    }

    //サーバーとの通信
    try {const response = await fetch("/api/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        username: username,
        email: email,
        password: password
      })
    });

    const result = await response.json();

    if (!response.ok) {
      showError(result.message);
      return;
    }

  showSuccess(result.message);

  setTimeout(() => {
    window.location.href =
      "/login.html";
  }, 1000);

} catch (error) {
  console.error(error);

  showError(
    "サーバーと通信できませんでした"
  );
}
  }
);