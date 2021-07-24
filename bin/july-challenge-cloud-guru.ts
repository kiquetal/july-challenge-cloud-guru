#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { JulyChallengeCloudGuruStack } from '../lib/july-challenge-cloud-guru-stack';

const app = new cdk.App();
new JulyChallengeCloudGuruStack(app, 'JulyChallengeCloudGuruStack');
