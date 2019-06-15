#! /usr/bin/env node

let argv = require('minimist')(process.argv.slice(2))
let R = require('ramda')
let fs = require('fs')
let path = require('path')
let mkdirp = require('mkdirp')
let Octokit = require('@octokit/rest')

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
    process.exit(0)
}

// todo support multiple?
let usernameFromCli = R.head(argv._)

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

async function getUserType(octokit, identifier) {
    // identifier can use user or org, let's figure out
    let usr = await octokit.users.getByUsername({username: identifier})
    return usr.data.type
}

async function getAllRepos(octokit, identifier) {
    let userType = await getUserType(octokit, identifier)
    switch(userType) {
        case 'Organization':
            return octokit.paginate('GET /orgs/:org/repos', {org: identifier, type: 'all'})
        case 'User':
            return octokit.paginate('GET /users/:username/repos', {username: identifier, type: 'all'})
        default:
            throw new Error(`Unknown user type: '${userType}'`)
    }
}

async function doDL(usr, destination, extension) {
    console.log(`Getting list of all repositories for '${usr}'`)
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
         let repodata = await getAllRepos(octokit, usr)
        
        // make target dir
        await mkdirp(destination)
        
        // write to target dir 
        let dataFn = path.join(destination, `${usr}-repo-data.json`)
        fs.writeFileSync(dataFn, JSON.stringify(repodata), {encoding: 'utf8'})
        let urlsFn = path.join(destination, `${usr}-repo-urls.txt`)
        let urls = repodata.map(r => `${r.ssh_url} ${r.name}${extension}`)
        fs.writeFileSync(urlsFn, urls.join('\n'), {encoding: 'utf8'})
        
        console.log(`\nFound ${urls.length} repositories, wrote data to:

- ${dataFn}
- ${urlsFn}

Run the following commands to clone all repos:
    
    cd ${destination}
    cat ${urlsFn} | xargs -n2 -P8 git clone
`)
    } catch (e) {
        console.error('Failed to login:', e.message)
        process.exit(-1)
    }
}

