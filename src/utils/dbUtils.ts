// dbUtils.ts
import { CourseDocument } from '~/types/courseMaterials'
import { supabase } from './supabaseClient'

export async function fetchEnabledDocGroups(courseName: string) {
  try {
    const { data: documentGroups, error } = await supabase
      .from('doc_groups')
      .select('name')
      .eq('course_name', courseName)
      .eq('enabled', true)

    if (error) {
      console.error('Failed to fetch enabled document groups:', error.message)
      throw new Error(
        `Failed to fetch enabled document groups: ${error.message}`,
      )
    }
    return documentGroups
  } catch (error) {
    console.error('Error in fetchEnabledDocGroups:', error)
    throw error
  }
}

export async function fetchDocumentGroups(courseName: string) {
  try {
    const { data: documentGroups, error } = await supabase
      .from('doc_groups')
      .select('id, name, enabled, doc_count')
      .eq('course_name', courseName)
      .order('name', { ascending: true })
    if (error) {
      console.error('Failed to fetch document groups:', error.message)
      throw new Error(`Failed to fetch document groups: ${error.message}`)
    }
    return documentGroups
  } catch (error) {
    console.error('Error in fetchDocumentGroups:', error)
    throw error
  }
}
// export async function addDocumentsToDocGroup(
//   courseName: string,
//   doc: CourseDocument,
// ) {
//   try {
//     const { data, error } = await supabase.rpc('add_document_to_group', {
//       p_course_name: courseName,
//       p_s3_path: doc.s3_path,
//       p_url: doc.url,
//       p_readable_filename: doc.readable_filename,
//       p_doc_groups: doc.doc_groups,
//     })
//     if (!data) {
//       console.error(
//         'Failed to add documents to doc group:',
//         data,
//         ' with error:',
//         error,
//       )
//       throw new Error(`Failed to add documents to doc group: ${error}`)
//     }
//     return data
//   } catch (error) {
//     console.error('Error in addDocumentsToDocGroup:', error)
//     throw error
//   }
// }

export async function addDocumentsToDocGroup(
  courseName: string,
  doc: CourseDocument,
) {
  try {
    // console.log('addDocumentsToDocGroup called with courseName:', courseName, 'and doc:', JSON.stringify(doc, null, 2));
    if (doc.url) {
      // If doc.url is present, it's the primary identifier.
      // Call the RPC that can handle URL-based lookups.
      // console.log(`Calling Supabase RPC: 'add_document_to_group_url' for document with URL: ${doc.url}, s3_path: ${doc.s3_path}`);
      const { data, error } = await supabase.rpc('add_document_to_group_url', {
        p_course_name: courseName,
        p_s3_path: doc.s3_path,
        p_url: doc.url,
        p_readable_filename: doc.readable_filename,
        p_doc_groups: doc.doc_groups,
      });
      if (!data) {
        console.error(
          'Failed to add documents to doc group (using URL path):',
          data,
          ' with error:',
          error,
        );
        throw new Error(`Failed to add documents to doc group (using URL path): ${error}`);
      }
      return data;
    } else {
      // If doc.url is not present, s3_path must be the identifier.
      // Call the RPC that (ostensibly) handles s3_path based lookups.
      // Note: The SQL for 'add_document_to_group' still has issues with empty p_s3_path.
      // console.log(`Calling Supabase RPC: 'add_document_to_group' for document with s3_path: ${doc.s3_path} (URL is null/empty)`);
      const { data, error } = await supabase.rpc('add_document_to_group', {
        p_course_name: courseName,
        p_s3_path: doc.s3_path,
        p_url: doc.url, // p_url would be null or empty here
        p_readable_filename: doc.readable_filename,
        p_doc_groups: doc.doc_groups,
      });
      if (!data) {
        console.error(
          'Failed to add documents to doc group (using s3_path path):',
          data,
          ' with error:',
          error,
        );
        throw new Error(`Failed to add documents to doc group (using s3_path path): ${error}`);
      }
      return data;
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
    await supabase.rpc('remove_document_from_group', {
      p_course_name: courseName,
      p_s3_path: doc.s3_path,
      p_url: doc.url,
      p_doc_group: docGroup,
    })
  } catch (error) {
    console.error('Error in removeDocGroup:', error)
    throw error
  }
}

export async function updateDocGroupStatus(
  courseName: string,
  docGroup: string,
  enabled: boolean,
) {
  try {
    const { error } = await supabase
      .from('doc_groups')
      .update({ enabled })
      .eq('name', docGroup)
      .eq('course_name', courseName)

    if (error) {
      console.error('Failed to update document group status:', error.message)
      throw new Error(
        `Failed to update document group status: ${error.message}`,
      )
    }
  } catch (error) {
    console.error('Error in updateDocGroupStatus:', error)
    throw error
  }
}
