const foldersService = {
    getAllFolders(knex){
        return knex
         .select('*')
         .from('folders');
    },
    insertFolder(knex, newFolder){
        return knex
         .insert(newFolder)
         .into('folders')
         .returning('*')
         .then(rows => { return rows[0] }); //return object of inserted folder
    },
    getFolderById(knex, id){
        return knex
         .from('folders')
         .where('folder_id', id)
         .first()
    },
    deleteFolder(knex, id){
        return knex('folders')
         .where('folder_id', id)
         .delete();
    },
    updateFolder(knex, id, updatedFolder){
        return knex('folders')
         .where('folder_id', id)
         .update(updatedFolder)
    },
    getFolderNotes(knex, id){
        return knex('notes')
            .where({folder_id: id});
    }
}

module.exports = foldersService