var pw = require('../');

process.stdout.write('Password: ');
// no output mask
pw('', function (password) {
    console.log('password=' + password);
})
