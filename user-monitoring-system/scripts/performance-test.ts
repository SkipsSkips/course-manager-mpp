import { exec } from 'child_process';

const runPerformanceTest = () => {
    exec('jmeter -n -t ./jmeter/test-plan.jmx -l ./jmeter/results.jtl', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing performance test: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`JMeter stderr: ${stderr}`);
            return;
        }
        console.log(`JMeter stdout: ${stdout}`);
    });
};

runPerformanceTest();