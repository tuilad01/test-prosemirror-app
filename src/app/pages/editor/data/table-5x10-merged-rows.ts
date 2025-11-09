export const table5x10WithMergedRows = {
  type: 'doc',
  content: [
    {
      type: 'table',
      content: [
        // --- Row 1: Contains the large merged cell (colspan: 3, rowspan: 10) ---
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 1, Col 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 3,
                rowspan: 10, // <-- This cell spans vertically down to row 10
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'COLS 2-4 MERGED (Spans Rows 1-10)',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 1, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
        // --- Rows 2 through 10: Omit the cell for the merged area ---
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 2, Col 1',
                    },
                  ],
                },
              ],
            },
            // NOTICE: The cell for columns 2-4 is MISSING here
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 2, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 3, Col 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 3, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 4, Col 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 4, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 5, Col 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 5, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 6, Col 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 6, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 7, Col 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 7, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 8, Col 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 8, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 9, Col 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 9, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 10, Col 1',
                    },
                  ],
                },
              ],
            },
            {
              type: 'table_cell',
              attrs: {
                colspan: 1,
                rowspan: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Row 10, Col 5',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
