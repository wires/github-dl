let argv = require('minimist')(process.argv.slice(2))
let Octokit = require('@octokit/rest')

if (argv.login){
    doLogin()
}

async function ask2FA() {
    return require('inquirer').prompt([
        {type: 'number', name: 'twoFactorAuth', message: '2FA'}
    ])
}

async function askUserPass() {
    return require('inquirer').prompt([
        {type: 'input', name: 'username', message: 'Username'},
        {type: 'password', name: 'password', mask: '*', message: 'Password'}
    ])
}

async function doLogin() {
    let answers = await askUserPass()
    
    let octokit = new Octokit({
        auth: {
            username: answers.username,
            password: answers.password,
            async on2fa () {
                let tfa = await ask2FA()
                return tfa.twoFactorAuth
            }
        }
    })

    try {
        let p = await octokit.activity.listPublicEvents()
        console.log(p)
    } catch (e) {
        console.error('Failed to login:', e.message)
        process.exit(-1)
    }
}

