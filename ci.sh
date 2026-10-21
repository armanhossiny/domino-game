CURRENT=`pwd`
BASENAME=`basename "$CURRENT"`

BRANCHNAME=`git branch --show-current 2>&1`
echo "run ci/cd at branch:$BRANCHNAME"


BASENAME="$BASENAME"_"$BRANCHNAME"
if [ ! -d ../$BASENAME ] ; then
  mkdir ../$BASENAME
fi
cp -a ./.env ../$BASENAME
cp -a ./* ../$BASENAME
cd ../$BASENAME
npm install
echo "check if process early running"
if npx pm2 describe "$BASENAME" >/dev/null 2>&1; then
    echo "Process exists"
    RUN=$(npx pm2 restart "$BASENAME" 2>&1)
    echo "pm2 restart result: $RUN"
else
    echo "Process does not exist"
    RUN=$(npx pm2 start ./app.js -i 1 --name "$BASENAME" 2>&1)
    echo "pm2 start result: $RUN"
fi