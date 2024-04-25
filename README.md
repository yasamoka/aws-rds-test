## Prerequisites

You must have [Node.js](https://nodejs.org/en) installed in order to use the AWS CDK.

## Instructions

#### Infrastructure deployment

1) Add an EC2 SSH key pair with the name `rds-test`.

2) After downloading the `rds-test` private key, fix permissions:

```sh
chmod 600 {RDS_TEST_PRIVATE_KEY_PATH}
```

3) Clone the repository:
```sh
git clone https://github.com/yasamoka/aws-rds-test
```

4) Deploy the CDK stack:

```sh
cd aws-rds-test/cdk
npm install # or whatever package manager you prefer to use
cdk deploy
```

#### Testing

1) SSH to the running EC2 instance:
```sh
ssh -i {RDS_TEST_PRIVATE_KEY_PATH} ec2-user@{EC2_HOST}
```

2) Download the latest test binary on the running EC2 instance:

```sh
wget https://github.com/yasamoka/aws-rds-test/releases/latest/download/test
```

3) Go to `AWS Secrets Manager` and retrieve the secret values for the RDS instance's `host` and `password`.

4) Add a .env file next to the test binary in the following format:
```sh
echo DATABASE_URL=\"host={RDS_HOST} port=5432 user=postgres password={RDS_PASSWORD}\" > .env
```

5) Run the test binary:
```sh
./test
```

You should get the following output:
```
Connected to database successfully.
```

Make sure to destroy the `RDSTestStack` from `CloudFormation` when you are done testing in order to not incur unnecessary charges.
