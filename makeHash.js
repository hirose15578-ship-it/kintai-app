const bcrypt = require("bcrypt");

async function makeHash() {

    const hash = await bcrypt.hash(password, 10);

    console.log(hash);
}

makeHash();