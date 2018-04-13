/**
 * Created by duncan on 1/23/18.
 */
// Uses fetch API and generators to poll.

export function pollJobStatus(
    url=undefined,
    onSuccess=(response)=>{console.log(response);},
    seconds=2,
    generator=undefined,
    secondsFunction=(seconds)=>{return seconds;}
){
    /*
    Polls a jobStatus url until the "status" key of the json response
    is either "Success" or "Error".

    url is required.
    onSuccess is passed the JSON that is retrieved from the jobStatus call, 
    which will have a "result" key with the packaged results. Packaged results
    change schema depending on their job.
    
    Example usage:
        runPolling(HUB_URL + "/jobStatus/133")
        
        - 2 seconds between each poll
        - will console log the response once the status switches to "Success"
        - will throw an error with the servers message if status goes to "Error"
    */
    let timeout = seconds * 1000;

    if(!generator){ // First call. Start up the geny.
        generator = pollGenerator(url);
    }

    let nextGen = generator.next();

    setTimeout(
        ()=>
            nextGen.value.then(function(jresp) {
                const status  = jresp.status;
                // Determine the meaning of status.
                const running = (status === "Running");
                const inQueue = (status === "InJobQueue");
                const hadError = (status === "Error");
                const hadSuccess = (status === "Success");
                
                const needTopollAgain = running || inQueue;

                if(needTopollAgain){
                    pollJobStatus(
                        url,
                        onSuccess,
                        secondsFunction(seconds),
                        generator
                    );
                } else if (hadSuccess){
                    onSuccess(jresp);
                } else if (hadError){
                    throw jresp.result.error;
                } else {
                    throw "unrecognized server response status when polling: "
                        + status;
                }
            }),
        timeout
    );
}

function *pollGenerator(url){
    while(true){
        yield fetch(url).then(parseJson);
    }
}

export function parseJson(resp){
    return resp.json();
}
