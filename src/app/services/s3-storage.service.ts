import { Injectable } from '@angular/core';
import * as S3 from 'aws-sdk/clients/s3';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class S3StorageService {

  constructor() { }

  private key_id = environment.AWS_KEY_ID;
  private key_secret = environment.AWS_KEY_SECRET;
  private region = environment.AWS_REGION;
  private bucketName = environment.BUCKET_NAME;

  private storage = new S3({
    region: this.region,
    accessKeyId: this.key_id,
    secretAccessKey: this.key_secret,
  });

  uploadImage(file: File, key: string) {
    return this.storage.putObject(
      { Key: key, Body: file, Bucket: this.bucketName },
      function (err, data) {
        if (err) {
          console.log("There was an error uploading your file: ", err);
          return false;
        }
        console.log("Successfully uploaded file.", data);
        return true;
      }
    );
  }

  deleteImg(key: string) {
    return this.storage
      .deleteObject({ Key: key, Bucket: this.bucketName })
      .promise();
  }
}
