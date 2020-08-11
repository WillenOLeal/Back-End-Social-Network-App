import S3 from 'aws-sdk/clients/s3';
import stream from 'stream';

export const deleteImgFromS3 = async (filename: string, folderName: string) => {

    let params = {
        Bucket: `${process.env.BUCKET_NAME}`,
        Key: `${folderName}/${filename}`,
    };

    const s3 = new S3(); 
    s3.deleteObject(params).promise(); 
}

export const uploadToS3FromStream = (filename: string, mimetype: string, folderName: string) => {

    let pass = new stream.PassThrough();

    let params = {
        Bucket: `${process.env.BUCKET_NAME}`,
        Key: `${folderName}/${filename}`,
        Body: pass,
        ACL: 'public-read', 
        ContentType: mimetype
    };

    const s3 = new S3(); 

    return {
        writeSream: pass, 
        promise: s3.upload(params).promise()
    }
  }