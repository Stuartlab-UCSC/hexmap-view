Code Repository
===============

The code repository is at
`github.com/ucscHexmap/hexagram <https://github.com/ucscHexmap/hexagram>`_, in
the dev branch for development.

Repository branches
...................
There are two main branches, "master" and "dev". Master is used to hold the
latest production version so should be kept clean. Nothing is ever comitted
directly into the master branch. It gets updated by the repository miester when
there is a new release by merging from the dev branch.

You may use
personal or project branches off of dev however working directly on the dev
branch is fine. Working directly on dev will allow the rest of us to use your
changes as soon as you push them to the remote repository. Otherwise you will
need to do a merge for others to easily use your work.

A git quick start
.................
Git comes pre-installed on most systems. Otherwise see https://github.com to
install it.

https://www.sourcetreeapp.com has a great UI for dealing with most of git. It
does all of the commands below and is especially good for viewing diffs.
However it is good to understand the sequence of events and commands behind it,
and sometimes the UI is slow to update.

These commands are everything you need from the point of checking out the dev
branch through committing your files and merging to dev if you've branched off
of it. If things awry, you may need some other commands.


#1. Get a copy of the source code on the dev branch. Change to the directory where
you want to put the source code, then::

 git clone https://github.com/ucscHexmap/hexagram
 cd hexagram

#2. Get status::

 git status

#3. By default you are on the master branch, so change to the dev branch. You
will see the dev branch reflected in the 'git status' output::

 git checkout dev
 git status

Now you can either work off of the dev branch, or create your own branch off of
dev. To work on your own branch create one as follows, otherwise skip this step
then follow the rest of the steps.

#4. We'll call the new branch 'mine' for this example. Notice to create or
change to an existing branch is the same command::

 git checkout mine
 git status

#5. Git has helpful messages when you want to commit. After you have added and
changed files, 'git status' gives something like::

 On branch mine
 Your branch is up-to-date with 'origin/dev/mine'.
 Changes to be committed:
   (use "git reset HEAD <file>..." to unstage)

 	modified:   server/statsLayer.py

 Changes not staged for commit:
   (use "git add <file>..." to update what will be committed)
   (use "git checkout -- <file>..." to discard changes in working directory)

	 modified:   client/colors.js

 Untracked files:
   (use "git add <file>..." to include in what will be committed)

 	.python/myFile

Adding and checking in files is a two stage process. In the above:

**server/statsLayer.py** is already staged for commit

**client/colors.js** is a modified, existing file that needs to be staged

**.python/myFile** is a new file

So do the appropriate action to stage all the file you want to commit.

#6. The second stage actually updates the repository::

 git commit

Add a short comment and quit the editor. This commits files to your local git
repository.

#7. If the commit went without any errors, you probably want to
push it to the remote repository for safe keeping in case you lose the files on
your laptop.

First pull down any changes from the remote repository so if a merge is
required, you can do it now before things get ugly::

 git pull

#8. If there are any merge conflicts, git will tell you about them, and you fix them
then commit as above. If there are no conflicts, your repository now has any
changes anyone else committed since last time you pulled. Now push your changes
to the remote repository::

 git push

Ta da! If you are working off the dev branch, you're golden.

Merging from your branch into dev
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
If you are working off of your own branch which is off of dev, you need to
merge your branch into dev.

#9. Change to the dev branch then update your local dev branch from the remote dev branch::

 git checkout dev
 git pull origin dev

#10. Now you do the merge from your branch to dev::

 git merge dev

#11. Make and do sanity testing. Then push your dev to the remote dev::

 git push dev

Good luck
