#!/bin/bash
set -e
source /pd_build/buildconfig

target_dir="/app/bin"
log_dir="/app/log"
conf_dir="/app/conf"
data_dir="/app/data"

header "Install application from release.tar"

run mkdir -p $target_dir
run chown app $target_dir

# Unpack the application and run yarn install.
pushd $target_dir
run run tar -x --owner app -f \
  /pd_build/release.tar .


#PATH=$PATH:$(which python2.7)

#PYTHON=$(which python2.7) run yarn global add node-gyp

run ln -s $(which python2.7) /usr/bin/python

#PYTHONPATH=$(which python2.7) PYTHON=$(which python2.7) PATH=$PATH:$(which python2.7) run python --version

PYTHON=$(which python2.7) PATH=$PATH:$(which python2.7) run yarn install


# Perform a release build of the source code. (-> dist)
run yarn release

# Copy the config file
run mkdir -p $conf_dir && \
  run cp /pd_build/config/campaign.json $conf_dir/campaign.json

# Create the log dir
run mkdir -p $log_dir && \
  run touch $log_dir/campaign.log && run chown -R app:app $log_dir

# Create the data space
run mkdir -p $data_dir && 
  run chown -R app:app $data_dir

# Install the script that runs the campaign service
run mkdir /etc/service/campaign
run cp /pd_build/runit/campaign /etc/service/campaign/run

