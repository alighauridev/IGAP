
export const pagination = ({limit=null,cursor=null})=>{
    let paginationFilter = {
        limit: 10,
        cursor: {}
    };
    if(limit){
        paginationFilter.limit = limit;
    }
    if(cursor){
        paginationFilter.cursor = {
            _id: {$lt: cursor}
        };
    }
    return paginationFilter;
}