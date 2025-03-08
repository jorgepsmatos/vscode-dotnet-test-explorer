import * as vscode from "vscode";
import { TestCommands } from "./testCommands";
import { ITestResult, TestResult } from "./testResult";
import { Utility } from "./utility";

export interface IDebugRunnerInfo {
    config?: vscode.DebugConfiguration;
    isSettingUp: boolean;
    isRunning: boolean;
    waitingForAttach: boolean;
    processId: string;
}

export class Debug {
    private processIdRegexp = /Process Id: (.*),/gm;

    public onData(data: string, debugRunnerInfo?: IDebugRunnerInfo): IDebugRunnerInfo  {

        if (!debugRunnerInfo) {
            debugRunnerInfo = {isRunning: false, isSettingUp: true, waitingForAttach: false, processId: ""};
        }

        if (!debugRunnerInfo.waitingForAttach) {
            debugRunnerInfo.waitingForAttach = data.indexOf("Process Id:") > -1;
        }

        if (debugRunnerInfo.processId.length <= 0) {
            const match = this.processIdRegexp.exec(data);

            if (match && match[1]) {
                debugRunnerInfo.processId = match[1];
            }
        }

        if (debugRunnerInfo.waitingForAttach && debugRunnerInfo.processId.length > 0) {
            const config = vscode.workspace.getConfiguration('dotnet-test-explorer.debugger');
            const pipeTransportEnabled = config.get<boolean>('pipeTransportEnabled', true);
            
            debugRunnerInfo.config = {
                name: "NET TestExplorer Core Attach",
                type: "coreclr",
                request: "attach",
                processId: debugRunnerInfo.processId,
            };

            if (pipeTransportEnabled) {
                debugRunnerInfo.config.pipeTransport = {
                    pipeCwd: config.get<string>('pipeCwd', "${workspaceFolder}"),
                    pipeProgram: config.get<string>('pipeProgram', "bash.exe"),
                    pipeArgs: config.get<string[]>('pipeArgs', ["-c"]),
                    debuggerArgs: config.get<string[]>('debuggerArgs', ["--interpreter=vscode"]),
                    debuggerPath: config.get<string>('debuggerPath', "netcoredbg.exe"),
                    quoteArgs: config.get<boolean>('quoteArgs', true)
                };
            }
        }

        return debugRunnerInfo;
    }
}
