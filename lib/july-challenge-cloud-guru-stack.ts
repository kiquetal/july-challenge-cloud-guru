import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as elastic from '@aws-cdk/aws-elasticache';
import {AmazonLinuxImage, BastionHostLinux, InstanceClass, InstanceSize, InstanceType, Peer} from "@aws-cdk/aws-ec2";
import {CfnSubnetGroup} from "@aws-cdk/aws-elasticache";
import {SecretValue} from "@aws-cdk/core";
export class JulyChallengeCloudGuruStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    let vpc = new ec2.Vpc(this,'ChallengeVPC',{
      cidr:'10.0.0.0/16',
      natGateways:1,
      maxAzs:2,
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
      let ec2SG= new ec2.SecurityGroup(this,'ec2SG',{
          vpc:vpc,
          allowAllOutbound:true
      });

      const bastion = new BastionHostLinux(this,'bastion-id', {
          vpc: vpc,
          securityGroup: ec2SG,
          instanceName: 'instance-bastion',
          machineImage: new AmazonLinuxImage(),
          instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
          subnetSelection: vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC})
      });

      bastion.instance.instance.addPropertyOverride('KeyName', 'for-bastion');


    let clusterSG= new ec2.SecurityGroup(this,'redisSG',{
      vpc:vpc,
      securityGroupName:"Security group for REDIS"

    });



    let rdsSG = new ec2.SecurityGroup(this,'rdsSG',{
      vpc:vpc
    });




    clusterSG.addIngressRule(ec2SG,ec2.Port.tcp(6579),'allow from ec2');
    rdsSG.addIngressRule(ec2SG,ec2.Port.tcp(5432),'allow from ec2');

    ec2SG.addIngressRule(Peer.anyIpv4(),ec2.Port.tcp(8080),'allow 8080 for public');
    ec2SG.addIngressRule(Peer.anyIpv4(),ec2.Port.tcp(80),'allow 8080 for public');
    ec2SG.addIngressRule(Peer.anyIpv4(),ec2.Port.tcp(22),'allow ssh from the world');


    let subnetRDS = new rds.SubnetGroup(this,'subnet for rds',{
      vpc: vpc,
      description:'rds for data',
      subnetGroupName:"subnet for rds",
      vpcSubnets: {
        subnets:subnetsForRds.subnets
      }
    });



    let db = new rds.DatabaseInstance(this,'db-instance',{
     vpc,
     engine:rds.DatabaseInstanceEngine.postgres({
       version:rds.PostgresEngineVersion.VER_11
     }),
      securityGroups:[rdsSG],
      subnetGroup:subnetRDS,
     instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3,
         ec2.InstanceSize.MICRO),
     multiAz:false,
     databaseName:'dbname',
      //@ts-ignore
     credentials:rds.Credentials.fromPassword('administrator',SecretValue.plainText("paraguay"))

   });


    let subnetGroupRedis: CfnSubnetGroup;
    // @ts-ignore
    subnetGroupRedis = new elastic.CfnSubnetGroup(this, "Redis subnetGroup", {

      cacheSubnetGroupName: "redis-private",
      subnetIds: subnetsForCluster.subnetIds,
      description: "Subnet para el redis"
    });
    // @ts-ignore
    let redis = new elastic.CfnCacheCluster(this,
        'Redis Cluster',{
      engine:'redis',
          cacheNodeType:"cache.t2.micro",
          numCacheNodes:1,
          clusterName:"cluster-redis",
          vpcSecurityGroupIds:[clusterSG.securityGroupId],
          cacheSubnetGroupName:subnetGroupRedis.cacheSubnetGroupName,

        });

    redis.addDependsOn(subnetGroupRedis);

  }
}
