const bcrypt = require("bcrypt");

async function makeHash() {

    const password = process.argv[2];

    if(!password) {
        console.log("使い方: node makeHash.js パスワード");
        return;
    }

    const hash = await bcrypt.hash(password, 10);
    console.log(hash);
}

makeHash();