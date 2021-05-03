// needs create api key for admins, CRUD on user
// initialize the admin SDK once here at the top level
import admin = require("firebase-admin");
admin.initializeApp();

// include our submodules so they'll be deployed
module.exports = {
  ...require("./user"),
};
