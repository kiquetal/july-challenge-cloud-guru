import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
export class JulyChallengeCloudGuruStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    let vpc = new ec2.Vpc(this,'ChallengeVPC',{
      cidr:'10.0.0.0/16',
      natGateways:1,
      maxAzs:1,
      subnetConfiguration: [
        {
          cidrMask:24,
          name:'App',
          subnetType:ec2.SubnetType.PUBLIC
        },
        {
          cidrMask:24,
          name:'Rds',
          subnetType:ec2.SubnetType.PRIVATE
        },
        {
          cidrMask:24,
          name:'Cache',
          subnetType:ec2.SubnetType.PRIVATE
        }
      ]
    });


    let subnetsForCluster = vpc.selectSubnets({ subnetGroupName:'Cache'});
    let subnetsForRds = vpc.selectSubnets({subnetGroupName:'Rds'});



  }
}
