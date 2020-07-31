import {unlink} from 'fs/promises'; 

export const deletePostImg =  (filename: string) => {

    unlink(__dirname + `/../../images/posts/${filename}`)
    .then(() => true)
    .catch(() => false)
}

export const deleteProfilePicture =  (filename: string) => {
    
    unlink(__dirname + `/../../images/profiles/${filename}`)
    .then(() => true)
    .catch(() => false)
}
