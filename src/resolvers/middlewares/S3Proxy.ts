import express from 'express';
import S3Proxy from 's3proxy';

const s3Proxy = express(); 
const proxy = new S3Proxy({ bucket: process.env.BUCKET_NAME });
proxy.init();


s3Proxy.get('/*',(req, res) => {
proxy.get(req,res)
    .on('error', () => res.end())
    .pipe(res);
});

export default s3Proxy; 