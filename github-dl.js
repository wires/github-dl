let argv = require('minimist')(process.argv.slice(2))
let R = require('ramda')
let fs = require('fs')
let path = require('path')
let mkdirp = require('mkdirp')
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

let usernameFromCli = R.head(argv._)
console.log('un:', usernameFromCli)
doDL(usernameFromCli, destination, extension)

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

async function doDL(usr, destination, extension) {
    console.log('usr', usr)
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
        // let repodata = await octokit.repos.listForUser({username: usr})
        // let options = octokit.repos.listForUser.endpoint.merge({ username: usr})
        let repodata = await octokit.paginate('GET /orgs/:org/repos', {org:usr,type:'all'})
        console.log('rd',repodata)
        // make target dir
        await mkdirp(destination)
        // write to target dir
        let s = JSON.stringify(repodata)
        fs.writeFileSync(path.join(destination, `${usr}-repo-data.json`), s, {encoding: 'utf8'})
        let urls = repodata.map(r => `${r.ssh_url}`).join('\n')
        fs.writeFileSync(path.join(destination, `${usr}-repo-urls.txt`), urls, {encoding: 'utf8'})
        console.log(JSON.stringify(repodata,null,2))
    } catch (e) {
        console.error('Failed to login:', e.message)
        process.exit(-1)
    }
}

