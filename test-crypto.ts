import crypto from "crypto";
const encryptedUrl = "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDy3oAkJDMbq8VkXOZU65DcFdrDhsTWIRT7u/8vMld9DHecVMFCBmD5/Rw7tS9a8Gtq";
const key = Buffer.from("38346591", "utf8");
const decipher = crypto.createDecipheriv("des-ecb", key, null);
decipher.setAutoPadding(false);
let dec = decipher.update(encryptedUrl, "base64", "utf8");
dec += decipher.final("utf8");
console.log("Decrypted:", dec.trim().replace(/_96\.mp4/, "_320.mp4"));
