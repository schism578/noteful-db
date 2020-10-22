const notesService = {
    getAllNotes(knex) {
        return knex
            .select('*')
            .from('notes');
    },

    insertNote(knex, newNote) {
        return knex
            .insert(newNote)
            .into('notes')
            .returning('*')
            .then(rows => { return rows[0] });
    },

    getById(knex, noteId) {
        return knex
            .from('notes')
            .select('*')
            .where('note_id', noteId)
            .first();
    },

    deleteNote(knex, noteId) {
        return knex('notes')
            .where('note_id', noteId)
            .delete();
    },

    updateNote(knex, noteId, newNote) {
        return knex('notes')
            .where('note_id', noteId)
            .update(newNote);
    }
};

module.exports = notesService;