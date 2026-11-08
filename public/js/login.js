const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const errorMessage = document.querySelector("#errorMessage");
const successMessage = document.querySelector("#successMessage");

function showError(message){
  errorMessage.textContent = message;
}

function clearError(){
  errorMessage.textContent = "";
}

function showSuccess(message){
  successMessage.textContent = message;
}

function clearSuccess(){
  successMessage.textContent = "";
}

//クリック・エンターどちらでも処理できる様eventを使用
loginForm.addEventListener("submit", async (event) => {
  
  event.preventDefault();
  clearError();
  clearSuccess();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if(email === ""){
    showError("メールアドレスを入力してください");
    emailInput.focus();
    return;
  }

  if(!emailInput.validity.valid){
    showError("正しい形式のメールアドレスを入力してください");
    emailInput.focus();
    return;
  }

 if(password === ""){
  showError("パスワードを入力してください");
  passwordInput.focus();
  return;
 }

  if(password.length < 8){
    showError("パスワードは8文字以上で入力してください");
    passwordInput.focus();
    return;
  }

  try{
    const response = await fetch("/api/login", {
     method: "POST",
     
     headers: {
      "Content-Type": "application/json"
     },

     body: JSON.stringify({
      email: email,
      password: password
     })
    });

    const result = await response.json();

    if(!response.ok){
      showError(result.message);
      return;
    }

    if (result.is_admin) {
  window.location.href = "/admin.html";
} else {
  window.location.href = "/mypage.html";
}
  }catch(error){
    console.error(error);

    showError("サーバーと通信できませんでした"
      
    );
  }

});