import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as JulyChallengeCloudGuru from '../lib/july-challenge-cloud-guru-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new JulyChallengeCloudGuru.JulyChallengeCloudGuruStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
