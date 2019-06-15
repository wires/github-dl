let argv = require('minimist')(process.argv.slice(2))
let R = require('ramda')
let Octokit = require('@octokit/rest')
console.log(argv)

let destination = argv.d || argv.destination || '.'
let extension = (argv.dotGit || argv.G) ? '.git' : ''

if(argv.help || (argv._.length <= 0)) {
    console.log(`Usage (--help):

Clone all repos (including private) from user 'wires' into folder 'repos':

    github-dl wires -G -d repos

Options:

    --destination, -d       destination folder, will be created if doesn't exist
    --dotGit, -G            store repos as 'name.git' instead of just 'name'
`)
}

doDL(R.head(argv._), destination, extension)

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

async function allRepos(user) {
    let p = await octokit.repos.listForUser(user)
    
}

async function doDL(user) {
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
        console.log(JSON.stringify(p))
    } catch (e) {
        console.error('Failed to login:', e.message)
        process.exit(-1)
    }
}

