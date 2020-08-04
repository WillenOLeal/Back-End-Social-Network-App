import faker from 'faker';

export const getUserObj = () => {
    return {
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password()
    }
}


export const getPostInput = () => {
    return {
        title: faker.lorem.sentence(),
        text: faker.lorem.paragraphs(),
        imgName: faker.lorem.slug()
    }
}