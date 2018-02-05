const Koa = require('koa');
const json = require('koa-json');
const bodyparser = require('koa-bodyparser');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = new Koa();
const config = require(`${__dirname}/ecosystem.json`);
app.use(bodyparser());
app.use(json());

let hooks = {}
config.apps.forEach(e => {
    hooks[e.key] = e
});

app.use(async ctx => {
    //Check User Agent
    let ua = ctx.headers['user-agent']
    if (!/^GitHub-Hookshot\//.test(ua)) { 
        ctx.status = 403;
        ctx.body = {
            err_code : 404,
            err_msg : "Not Github Hookshot"
        }
        return ;        
    }
    //let delivery = ctx.headers['x-github-delivery']
    //Find App
    let data = ctx.request.body
    let appKey = ctx.path.replace(/^\//, '')
    if (!hooks[appKey]) { 
        ctx.status = 404;
        ctx.body = {
            err_code : 404,
            err_msg : "Can not find this app"
        }
        return ;
    }
    //Check Secret
    let signature = ctx.headers['x-hub-signature'].replace(/^sha1=/,'')
    const hmac = crypto.createHmac('sha1', hooks[appKey].secret);
    hmac.update(JSON.stringify(ctx.request.body));
    if (hooks[appKey].secret && hmac.digest('hex') != signature) {
        ctx.status = 403;
        ctx.body = {
            err_code : 403,
            err_msg : "Wrong Secret"
        }
        return ;        
    }

    //Check Event
    let event = ctx.headers['x-github-event']
    if (event != "push") { 
        ctx.body = {
            err_msg : "OK"
        }
        return ;
    }
    //Find Branch
    hooks[appKey].cmd.forEach(e => { 
        if (data.ref == `refs/heads/${e.branch}`) { 
            exec(`cd ${hooks[appKey].cwd} && ${e.cmd}`);
        }
    })
    ctx.body = {
        err_code: 200,
        err_msg : "OK"
    };
});

app.listen(8000);