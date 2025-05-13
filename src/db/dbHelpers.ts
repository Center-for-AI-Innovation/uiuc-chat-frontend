import { eq, and, like, desc, sql, asc } from 'drizzle-orm';
import { db } from './dbClient';
import { apiKeys, conversations, documents, messages, projects, courseNames, docGroups, documentsDocGroups } from './schema';
import { CourseDocument } from '~/types/courseMaterials';


// Db queries

export async function fetchEnabledDocGroups(courseName: string) {
  try {
      const documentGroups = await db.query.docGroups.findMany({
        where: eq(docGroups.course_name, courseName),
        with: {
          documentsJunction: true,
        },
      })

      return documentGroups
  } catch (error) {
    console.error('Error in fetchEnabledDocGroups:', error)
    throw new Error(`Failed to fetch enabled document groups: ${error instanceof Error ? error.message : String(error)}`);
  }
}


export async function fetchDocumentGroups(courseName: string) {
  try {
    const documentGroups = await db.query.docGroups.findMany({
      orderBy: [asc(docGroups.name)],
      where: eq(docGroups.course_name, courseName),
      columns: {
        id: true,
        name: true,
        enabled: true,
        doc_count: true
      }
    });
    return documentGroups;
  } catch (error) {
    console.error('Error in fetchDocumentGroups:', error)
    throw error
  }
}


export async function addDocumentsToDocGroup(
  courseName: string,
  doc: CourseDocument,
) {
  try {
    // Call the Postgres function directly using db.execute and sql
    if (doc.url) {
      const result = await db.execute(sql`
        select add_document_to_group(
          ${courseName},
          ${doc.s3_path},
          ${doc.url},
          ${doc.readable_filename},
          ${doc.doc_groups}
        ) as success;
      `);
      // Ensure result is an array and not undefined
      const rows = Array.isArray(result) ? result : [];
      const success = rows.length > 0 && rows[0] && typeof rows[0].success !== 'undefined' ? rows[0].success : false;
      if (!success) {
        throw new Error('Failed to add documents to doc group');
      }
      return success;
    } else {
      const result = await db.execute(sql`
        select add_document_to_group_url(
          ${courseName},
          ${doc.s3_path},
          ${doc.url},
          ${doc.readable_filename},
          ${doc.doc_groups}
        ) as success;
      `);
      // Ensure result is an array and not undefined
      const rows = Array.isArray(result) ? result : [];
      const success = rows.length > 0 && rows[0] && typeof rows[0].success !== 'undefined' ? rows[0].success : false;
      if (!success) {
        throw new Error('Failed to add documents to doc group');
      }
      return success;
    }
  } catch (error) {
    console.error('Error in addDocumentsToDocGroup:', error);
    throw error;
  }
}

export async function removeDocGroup(
  courseName: string,
  doc: CourseDocument,
  docGroup: string,
) {
  try {
    await db.execute(sql`
      select remove_document_from_group(
        ${courseName},
        ${doc.s3_path},
        ${doc.url},
        ${docGroup}
      );
    `);
  } catch (error) {
    console.error('Error in removeDocGroup:', error);
    throw error;
  }
}


export async function updateDocGroupStatus(
  courseName: string,
  docGroup: string,
  enabled: boolean,
) {
  try {
    await db
      .update(docGroups)
      .set({ enabled })
      .where(
        and(
          eq(docGroups.name, docGroup),
          eq(docGroups.course_name, courseName)
        )
      );
  } catch (error) {
    console.error('Error in updateDocGroupStatus:', error)
    throw error
  }
}

// // Get all conversations for a user
// export async function getUserConversations(userEmail: string) {
//   return db.select()
//     .from(conversations)
//     .where(eq(conversations.user_email, userEmail))
//     .orderBy(desc(conversations.updated_at));
// }

// // Get conversation with its messages using relations
// export async function getConversationWithMessages(conversationId: number) {
//   return db.query.conversations.findFirst({
//     where: eq(conversations.id, conversationId),
//     with: {
//       messages: {
//         orderBy: messages.created_at
//       }
//     }
//   });
// }

// // Get documents for a course
// export async function getCourseDocuments(courseName: string) {
//   return db.select()
//     .from(documents)
//     .where(eq(documents.course_name, courseName));
// }

// // Get documents in a specific doc group using the many-to-many relationship
// export async function getDocumentsInGroup(docGroupId: number) {
//   return db.select({
//     documentId: documents.id,
//     s3Path: documents.s3_path,
//     url: documents.url,
//     readableFilename: documents.readable_filename,
//     status: documents.status,
//     createdAt: documents.created_at
//   })
//   .from(documents)
//   .innerJoin(documentsDocGroups, eq(documentsDocGroups.document_id, documents.id))
//   .where(eq(documentsDocGroups.doc_group_id, docGroupId));
// }

// // Get doc groups for a specific document
// export async function getDocGroupsForDocument(documentId: number) {
//   return db.select({
//     docGroupId: docGroups.id,
//     name: docGroups.name,
//     courseName: docGroups.course_name,
//     description: docGroups.description
//   })
//   .from(docGroups)
//   .innerJoin(documentsDocGroups, eq(documentsDocGroups.doc_group_id, docGroups.id))
//   .where(eq(documentsDocGroups.document_id, documentId));
// }

// // Create a new project
// export async function createProject(name: string, description: string, ownerId: string) {
//   return db.insert(projects)
//     .values({
//       name,
//       description,
//       owner_id: ownerId,
//     })
//     .returning();
// }

// // Update a document status
// export async function updateDocumentStatus(documentId: number, status: string, failedReason?: string) {
//   return db.update(documents)
//     .set({ 
//       status,
//       failed_reason: failedReason,
//       updated_at: new Date()
//     })
//     .where(eq(documents.id, documentId))
//     .returning();
// }

// // Add a document to a doc group
// export async function addDocumentToDocGroup(documentId: number, docGroupId: number) {
//   // Check if the relationship already exists
//   const existing = await db.select()
//     .from(documentsDocGroups)
//     .where(and(
//       eq(documentsDocGroups.document_id, documentId),
//       eq(documentsDocGroups.doc_group_id, docGroupId)
//     ))
//     .limit(1);
  
//   // If it doesn't exist, create it
//   if (existing.length === 0) {
//     await db.insert(documentsDocGroups)
//       .values({
//         document_id: documentId,
//         doc_group_id: docGroupId
//       });
    
//     // Update doc_count in doc_groups
//     await db.execute(sql`
//       UPDATE doc_groups 
//       SET doc_count = (
//         SELECT COUNT(*) 
//         FROM documents_doc_groups 
//         WHERE doc_group_id = ${docGroupId}
//       )
//       WHERE id = ${docGroupId}
//     `);
//   }
  
//   return true;
// }

// // Remove a document from a doc group
// export async function removeDocumentFromDocGroup(documentId: number, docGroupId: number) {
//   await db.delete(documentsDocGroups)
//     .where(and(
//       eq(documentsDocGroups.document_id, documentId),
//       eq(documentsDocGroups.doc_group_id, docGroupId)
//     ));
  
//   // Update doc_count in doc_groups
//   await db.execute(sql`
//     UPDATE doc_groups 
//     SET doc_count = (
//       SELECT COUNT(*) 
//       FROM documents_doc_groups 
//       WHERE doc_group_id = ${docGroupId}
//     )
//     WHERE id = ${docGroupId}
//   `);
  
//   return true;
// } 