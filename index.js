const Koa = require('koa');
const app = new Koa();
const config = require(`${__dirname}/ecosystem.json`);
app.use(async ctx => {
    let event = ctx.headers['X-GitHub-Event']
    let delivery = ctx.headers['X-GitHub-Delivery']
    let signature = ctx.headers['X-Hub-Signature']
    ctx.body = {
        event,
        delivery,
        signature,
        config,
        path: ctx.path,
        data : ctx.request.body
    };
    console.log({
        event,
        delivery,
        signature,
        path: ctx.path,
        data : ctx.request.body
    });
});

app.listen(8000);