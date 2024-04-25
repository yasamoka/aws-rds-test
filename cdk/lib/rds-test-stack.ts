import * as cdk from "aws-cdk-lib";
import { aws_ec2 as ec2, aws_rds as rds } from "aws-cdk-lib";
import { Construct } from "constructs";

export class RDSTestStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // VPC

        const vpc = new ec2.Vpc(this, "vpc", {
            ipProtocol: ec2.IpProtocol.DUAL_STACK,
            ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
            maxAzs: 2,
            defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
            subnetConfiguration: [
                {
                    cidrMask: 20,
                    name: "public",
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 20,
                    name: "private",
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
        });

        // EC2

        const ec2KeyPair = ec2.KeyPair.fromKeyPairAttributes(this, "key-pair", {
            keyPairName: "rds-test",
            type: ec2.KeyPairType.ED25519,
        });

        const ec2SecurityGroup = new ec2.SecurityGroup(this, "security-group", {
            vpc,
            allowAllOutbound: true,
            allowAllIpv6Outbound: true,
        });

        ec2SecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.allIcmp(),
            "Allow ICMP from anyone"
        );

        ec2SecurityGroup.addIngressRule(
            ec2.Peer.anyIpv6(),
            ec2.Port.allIcmpV6(),
            "Allow ICMPv6 from anyone"
        );

        ec2SecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(22),
            "Allow SSH from anyone (v4)"
        );

        ec2SecurityGroup.addIngressRule(
            ec2.Peer.anyIpv6(),
            ec2.Port.tcp(22),
            "Allow SSH from anyone (v6)"
        );

        const ec2Instance = new ec2.Instance(this, "ec2", {
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machineImage: ec2.MachineImage.latestAmazonLinux2023(),
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            keyPair: ec2KeyPair,
            securityGroup: ec2SecurityGroup,
        });

        // Elastic IP address

        new ec2.CfnEIP(this, "eip", {
            instanceId: ec2Instance.instanceId,
        });

        // RDS

        const db = new rds.DatabaseInstance(this, "rds", {
            vpc,
            engine: rds.DatabaseInstanceEngine.POSTGRES,
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T4G,
                ec2.InstanceSize.MICRO
            ),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
            availabilityZone: "eu-west-3a",
            multiAz: false,
            allocatedStorage: 20,
        });

        db.connections.allowFrom(
            ec2Instance,
            ec2.Port.tcp(5432),
            "RDS connection to EC2"
        );
    }
}
