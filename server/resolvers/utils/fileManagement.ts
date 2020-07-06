import {unlink} from 'fs'; 

export const deletePostImg =  async (filename: string) => {

    unlink(__dirname + `/../../images/posts/${filename}`, (err) => {
        if(err) return false
        console.log('deleted'); 
        return true
    } )
}

