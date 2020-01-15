"use strict";
exports.__esModule = true;
var axios = require("axios");
var ax = axios;
ax.get('http://localhost:8082/world').then(function (response) {
    console.log(response.data);
});
