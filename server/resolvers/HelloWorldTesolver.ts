import {Query, Resolver} from'type-graphql'; 


@Resolver()
export class HelloWorldResolver {
    @Query(type => String)
    hello() {
        return 'hi!'; 
    }
}
