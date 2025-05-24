// qdrantUtils.ts
import { CourseDocument } from '~/types/courseMaterials'
import { qdrant } from '@/utils/qdrantClient'
import posthog from 'posthog-js'

const collection_name = process.env.QDRANT_COLLECTION_NAME

// Uncomment to test collection schema:
// async function getCollectionSchema(collectionName: string) {
//   try {
//     const response = await qdrant.getCollection(collectionName);
//     return response;
//   } catch (error) {
//     console.error('Error retrieving collection schema:', error);
//     throw error;
//   }
// }

export async function addDocumentsToDocGroupQdrant(
  courseName: string,
  doc: CourseDocument,
) {
  try {
    // Uncomment with function definition to test collection schema:
    // const schema = await getCollectionSchema(collection_name ? collection_name : "");
    // console.log("Collection Schema:", schema);

    const searchFilter = {
      must: [
        {
          key: 'course_name',
          match: {
            value: courseName,
          },
        },
        ...(doc.url ? [{
          key: 'url',
          match: {
            value: doc.url,
          },
        }] : []),
        {
          key: 's3_path',
          match: {
            value: doc.s3_path ? doc.s3_path : '',
          },
        },
      ],
    }
    // console.log("Doc s3_path: ", doc.s3_path);
    // console.log("Doc url: ", doc.url);
    // console.log("Document being used:", doc);
    // console.log("Search filter being used:", JSON.stringify(searchFilter, null, 2));

    // Following commented out code can be used for verifying Qdrant updates:
    // const dummyVector = new Array(1536).fill(0);

    // const searchResultBefore = await qdrant.search(collection_name ? collection_name : "", {
    //   vector: dummyVector,
    //   filter: searchFilter,
    //   with_payload: true,
    //   with_vector: false,
    // });

    // console.log("Previous vectors:");
    // for (const document of searchResultBefore) {
    //   console.log("Payload:", document.payload);
    // }
    // console.log('Filter used for adding doc to doc group: ', searchFilter, 'payload:', doc.doc_groups)

    const response = await qdrant.setPayload(collection_name ? collection_name : '', {
      payload: {
        doc_groups: doc.doc_groups,
      },
      filter: searchFilter,
    })

    // const searchResultAfter = await qdrant.search(collection_name ? collection_name : "", {
    //   vector: dummyVector,
    //   filter: searchFilter,
    //   with_payload: true,
    // });

    // console.log("Updated vectors:");
    // for (const document of searchResultAfter) {
    //   console.log("Payload:", document.payload);
    // }
    // console.log('Successfully added documents to doc group: ', response)
    return response
  } catch (error) {
    console.error('Error in addDocumentsToDocGroup:', error)

    posthog.capture('add_doc_group', {
      course_name: courseName,
      doc_readable_filename: doc.readable_filename,
      doc_unique_identifier:
        doc.url && doc.url !== ''
          ? doc.url
          : doc.s3_path && doc.s3_path !== ''
            ? doc.s3_path
            : null,
      doc_groups: doc.doc_groups,
      error_logs: error,
    })

    throw error
  }
}
