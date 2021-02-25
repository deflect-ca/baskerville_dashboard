"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var environment_1 = require("../../environments/environment");
function validateFileSize(file) {
    return sizeInMB(file.size) <= environment_1.environment.maxFileSize;
}
function sizeInMB(sizeInBytes) {
    return sizeInBytes / 1024 / 1024;
}
