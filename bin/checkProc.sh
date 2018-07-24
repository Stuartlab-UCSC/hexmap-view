
#!/bin/bash

# Check for a server process running.
source $HEX_VIEWER_CONFIG

if pgrep -U $HEX_UID uwsgi >/dev/null 2>&1; then
    # is running
    exit 1
else
    # is not running
    exit 0
fi
