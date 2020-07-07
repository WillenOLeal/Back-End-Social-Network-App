import {unlink} from 'fs'; 

export const deletePostImg =  async (filename: string) => {

    unlink(__dirname + `/../../images/posts/${filename}`, (err) => {
        if(err) return false
        return true
    } )
}

export const deleteProfilePicture =  async (filename: string) => {

    unlink(__dirname + `/../../images/pictures/${filename}`, (err) => {
        if(err) return false
        return true
    } )
}
