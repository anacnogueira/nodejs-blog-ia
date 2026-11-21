import { pool } from '../database/postgres.js'

export async function findAll() {
    const result = await pool.query(
        `SELECT id, title, content, published_at, created_at, approved_at, rejected_at
         FROM posts
         ORDER BY published_at DESC`,
    )

    return result.rows
}

export async function findById(id) {
    const result = await pool.query(
        `SELECT id, title, content, published_at, created_at, approved_at, rejected_at
         FROM posts
         WHERE id = $1`,
        [id],
    )

    return result.rows[0] ?? null
}

export async function create(post) {
    const result = await pool.query(
        `INSERT INTO posts (id, title, content, published_at, created_at, approved_at, rejected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title, content, published_at, created_at, approved_at, rejected_at`,
        [
            post.id,
            post.title,
            post.content,
            post.published_at,
            post.created_at,
            post.approved_at,
            post.rejected_at,
        ],
    )

    return result.rows[0]
}

export async function approve(id, approvedAt) {
    const result = await pool.query(
        `UPDATE posts
         SET approved_at = $2,
         published_at = $2,
         rejected_at = NULL
         WHERE id = $1
         RETURNING id, title, content, published_at, created_at, approved_at, rejected_at`,
        [id, approvedAt],
    )

    return result.rows[0] ?? null
}

export async function reject(id, rejectedAt) {
    const result = await pool.query(
        `UPDATE posts
         SET rejected_at = $2,
         published_at = NULL,
         approved_at = NULL
         WHERE id = $1
         RETURNING id, title, content, published_at, created_at, approved_at, rejected_at`,
        [id, rejectedAt],
    )

    return result.rows[0] ?? null
}
