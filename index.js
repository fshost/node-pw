var tty = require('tty');

module.exports = function () {
    var opts = {
        separator : '*',
        in : process.stdin,
        out : process.stdout,
        cb : function () {}
    };
    
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        switch (typeof arg) {
            case 'string' :
                opts.separator = arg;
                break;
            case 'function' :
                opts.cb = arg;
                break;
            case 'object' :
                if (arg.writable) {
                    opts.out = arg;
                }
                if (arg.readable) {
                    opts.in = arg;
                }
                break;
        }
    }
    
    var stream = {
        in : opts.in,
        out : opts.out
    };
    
    var sep = opts.separator;
    var cb = opts.cb;

    function setRawMode(input, state) {
        if (input.setRawMode) {
            input.setRawMode(state);
        } else {
            tty.setRawMode(state);
        }
    }
    
    if (stream.in === process.stdin) {
        setRawMode(stream.in, true);
    }
    
    var line = '';
    stream.in.on('data', function ondata (buf) {
        function finish () {
            if (stream.in === process.stdin) {
                setRawMode(stream.in, false);
            }
            if (stream.in.pause) stream.in.pause();
            stream.in.removeListener('data', ondata);
        }
        
        if (buf.length === 1) {
            if (buf[0] === 3) {
                finish();
                process.exit();
            }
            else if (buf[0] === 4) {
                finish();
                cb(line);
                return;
            }
            else if (buf[0] === 0x7f) {
                if (stream.out && line.length) {
                    stream.out.write('\b \b');
                }
                line = line.slice(0,-1);
                return;
            }
        }
        
        for (var i = 0; i < buf.length; i++) {
            var c = String.fromCharCode(buf[i]);
            if (c === '\n' || c === '\r') {
                finish();
                if (stream.out) stream.out.write('\r\n');
                cb(line);
                break;
            }
			else if (c === '\b') {
                line = line.substr(0, line.length - 1);
            }
            else {
                if (stream.out) stream.out.write(sep);
                line += c;
            }
        }
    });
    
    if (stream.in.resume) stream.in.resume();
};
