# Clone all repos from Github (including private)

#### Installation

	npm install -g github-dl

But! You do not have to install it, you can use it without installation:

	npx github-dl username

#### Usage

Clone all repos (including private) from user `wires` into folder `repos`:

    github-dl wires -G -d repos

Options:

- `--destination`, `-d` set destination folder, will be created if doesn't exist
- `--dotGit`, `-G` clone repositories as `[name].git` instead of just `name`

When you run the command, it will ask for your github credentials (to get the list of repositories)

```
? Username wires
? Password ************************
? 2FA 123456
```

(ps. if you get a 2FA that starts with one or more zeros, this won't work. Wait until the next one)

It now gets the list of repositories and stores them in two files in the target folder.

1. `repo-data.json` all information and meta data for each repo
2. `repo-urls.txt` just a list of git URLs for each repo

To download all the repos (assuming we ran with `-d repos`), run

	cat repos/repo-urls.txt | xargs -n2 -P8 git clone

(this will run 8 processes in parallel, one git clone per line of the file)


### Related

Some related/similar tools:

- [gitall](https://www.npmjs.com/package/gitall)
- [gitim](https://github.com/muhasturk/gitim)

and this stackoverflow question has a ton of tools/approaches listed
- https://stackoverflow.com/questions/19576742/how-to-clone-all-repos-at-once-from-github

