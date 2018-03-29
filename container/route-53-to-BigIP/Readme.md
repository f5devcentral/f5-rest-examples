# General 
This is F5 iControlLX application that retrieves Route53 information and update One or several BigIP

# Deploy
docker build -t route53-to-bigip .

# Run 
docker run --rm  --name route53-to-bigip -e BIGIP_LIST='<username>:<password>:<IP>' -e accessKeyId="<accessKeyId>" -e secretAccessKey="<secretAccessKey>" -e region="us-east-1" route53-to-bigip

 